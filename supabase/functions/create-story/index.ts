// Follow this type convention:
// https://supabase.com/docs/guides/functions/typescript

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import OpenAI from "npm:openai@4"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface StoryRequest {
    request_id: string
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders })
    }

    let request_id: string | undefined

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        const openaiKey = Deno.env.get("OPENAI_API_KEY")!

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const openai = new OpenAI({ apiKey: openaiKey })

        const body = await req.json() as StoryRequest
        request_id = body.request_id

        // 1. Fetch request with all related data
        const { data: request, error: reqError } = await supabase
            .from("story_requests")
            .select(`
        *,
        category:story_categories(*),
        moral:morals(*),
        request_children:story_request_children(
          child:children(*)
        ),
        request_characters:story_request_characters(
          category_character:category_characters(*),
          side_character:side_characters(*)
        )
      `)
            .eq("id", request_id)
            .single()

        if (reqError) throw reqError
        if (!request) throw new Error("Request not found")

        // 2. Update status to generating_text
        await supabase
            .from("story_requests")
            .update({ status: "generating_text", started_at: new Date().toISOString() })
            .eq("id", request_id)

        // 3. Build the prompt
        const children = request.request_children.map((rc: any) => rc.child)
        const categoryChars = request.request_characters
            .filter((rc: any) => rc.category_character)
            .map((rc: any) => rc.category_character.name)
        const sideChars = request.request_characters
            .filter((rc: any) => rc.side_character)
            .map((rc: any) => `${rc.side_character.name} (${rc.side_character.char_type})`)

        // 3.1 Load accessibility settings for all children
        const childIds = children.map((c: any) => c.id)
        const { data: accessibilityData } = await supabase
            .from("child_accessibility")
            .select("*")
            .in("child_id", childIds)
            .eq("include_in_stories", true)

        // 3.2 Merge accessibility settings (strictest wins for safety filters)
        let accessibilityContext = ""
        if (accessibilityData && accessibilityData.length > 0) {
            const merged = {
                intensity: "implicit",
                mobility_wheelchair: false,
                mobility_crutches: false,
                mobility_needs_breaks: false,
                vision_blind: false,
                vision_low_vision: false,
                hearing_hard_of_hearing: false,
                reading_need_calm_clear: false,
                no_sudden_loud_events: false,
                no_scary: false,
                no_surprises: false,
                need_simple_language: false,
                prefer_routines: false,
            }

            // Merge: OR for features, strictest for safety, highest intensity
            for (const acc of accessibilityData) {
                // Features (OR merge)
                if (acc.mobility_wheelchair) merged.mobility_wheelchair = true
                if (acc.mobility_crutches) merged.mobility_crutches = true
                if (acc.mobility_needs_breaks) merged.mobility_needs_breaks = true
                if (acc.vision_blind) merged.vision_blind = true
                if (acc.vision_low_vision) merged.vision_low_vision = true
                if (acc.hearing_hard_of_hearing) merged.hearing_hard_of_hearing = true
                if (acc.reading_need_calm_clear) merged.reading_need_calm_clear = true
                // Safety filters (OR = strictest)
                if (acc.no_sudden_loud_events) merged.no_sudden_loud_events = true
                if (acc.no_scary) merged.no_scary = true
                if (acc.no_surprises) merged.no_surprises = true
                // Language (OR = simplest)
                if (acc.need_simple_language) merged.need_simple_language = true
                if (acc.prefer_routines) merged.prefer_routines = true
                // Intensity (highest wins)
                if (acc.intensity === "active") merged.intensity = "active"
                else if (acc.intensity === "normal" && merged.intensity !== "active") merged.intensity = "normal"
            }

            // Build accessibility context string
            const contextParts = []

            // Mobility
            if (merged.mobility_wheelchair) contextParts.push("Ein Kind nutzt einen Rollstuhl (respektvoll, alltaeglich darstellen)")
            if (merged.mobility_crutches) contextParts.push("Ein Kind nutzt Kruecken (respektvoll, alltaeglich darstellen)")
            if (merged.mobility_needs_breaks) contextParts.push("Ein Kind braucht Pausen beim Gehen")

            // Vision
            if (merged.vision_blind) {
                contextParts.push("Ein Kind ist blind - verwende multisensorische Beschreibungen (Geraeusche, Duefte, Texturen, Waerme) statt visuelle")
            } else if (merged.vision_low_vision) {
                contextParts.push("Ein Kind ist sehbehindert - nutze klare, kontrastreiche Beschreibungen")
            }

            // Hearing
            if (merged.hearing_hard_of_hearing) contextParts.push("Ein Kind ist schwerhoerig")
            if (merged.reading_need_calm_clear) contextParts.push("WICHTIG: Verwende ruhige, klare Sprache beim Vorlesen")

            // Safety filters
            if (merged.no_sudden_loud_events) contextParts.push("WICHTIG: Keine ploetzlichen lauten Ereignisse (Boom, Knall, Schrei)")
            if (merged.no_scary) contextParts.push("WICHTIG: Keine gruseligen oder bedrohlichen Situationen")
            if (merged.no_surprises) contextParts.push("WICHTIG: Keine ploetzlichen Ueberraschungen, sanfte Uebergaenge")

            // Language
            if (merged.need_simple_language) contextParts.push("Verwende einfache, klare Sprache mit kurzen Saetzen")
            if (merged.prefer_routines) contextParts.push("Baue wiederkehrende Rituale und bekannte Strukturen ein")

            if (contextParts.length > 0) {
                const intensityNote = merged.intensity === "implicit"
                    ? "Beruecksichtige diese Aspekte subtil in Wortwahl und Umgebung, ohne sie explizit zu erwaehnen."
                    : merged.intensity === "normal"
                        ? "Hilfsmittel duerfen vorkommen, aber nicht erklaert oder problematisiert werden."
                        : "Hilfsmittel und Beduerfnisse koennen aktiv Teil der Handlung sein (z.B. Rampen, Pausen), aber stets positiv und alltaeglich."

                accessibilityContext = `

ACCESSIBILITY_CONTEXT (Barrierefreiheit):
${contextParts.map(p => `- ${p}`).join("\n")}

${intensityNote}
Grundregeln: Keine Mitleidsnarrative, keine "Heilung" als Storyline, Fokus auf Selbstwirksamkeit und Geborgenheit.
`
            }
        }

        const mainCharacters = children.map((c: any) =>
            `${c.name} (${c.age} Jahre, ${c.gender})`
        ).join(", ")

        // Target reading times: kurz=5min, normal=8min, lang=12min
        // At ~130 words/min reading aloud: 650 / 1040 / 1560 words
        const lengthInstructions = {
            kurz: "STRENGE LÄNGENANFORDERUNG: Die Geschichte MUSS MINDESTENS 600-700 Wörter haben (5 Minuten Vorlesezeit). Schreibe MINDESTENS 8-10 Absätze mit 3-4 Szenen. DIES IST ZWINGEND ERFORDERLICH!",
            normal: "STRENGE LÄNGENANFORDERUNG: Die Geschichte MUSS MINDESTENS 1000-1200 Wörter haben (8 Minuten Vorlesezeit). Schreibe MINDESTENS 12-15 Absätze mit 5-6 Szenen. DIES IST ZWINGEND ERFORDERLICH!",
            lang: "STRENGE LÄNGENANFORDERUNG: Die Geschichte MUSS MINDESTENS 1500-1800 Wörter haben (12 Minuten Vorlesezeit). Schreibe MINDESTENS 18-22 Absätze mit 7-8 Szenen. DIES IST ZWINGEND ERFORDERLICH!",
        }

        // Build character instructions for the prompt
        const extraCharacterLines: string[] = []
        if (categoryChars.length > 0) {
            extraCharacterLines.push(`**Aktive Mitspieler aus der Kategorie:** ${categoryChars.join(", ")}`)
        }
        if (sideChars.length > 0) {
            extraCharacterLines.push(`**Aktive Begleitpersonen (Familie/Freunde):** ${sideChars.join(", ")}`)
        }

        const userPrompt = `
Erstelle eine Gute-Nacht-Geschichte mit folgenden Vorgaben:

**Hauptfiguren:** ${mainCharacters}
${extraCharacterLines.join("\n")}
**Kategorie:** ${request.category?.name || "Frei"}
${request.location ? `**Ort:** ${request.location}` : ""}
${request.moral?.text && request.moral.slug !== "none" ? `**Moral:** ${request.moral.text}` : ""}

${lengthInstructions[request.length as keyof typeof lengthInstructions]}
${accessibilityContext}
`.trim()

        const systemPrompt = `Du bist ein liebevoller Geschichtenerzähler für Kinder. 
Deine Geschichten sind:
- Warm, fantasievoll and kindgerecht (1-12 Jahre)
- Frei von gruseligen, gewalttätigen oder traurigen Elementen
- Mit einem positiven, beruhigenden Ende
- WICHTIG: Schreibe IMMER mit korrekten deutschen Umlauten: ä, ö, ü (NIEMALS ae, oe, ue!) und verwende ss statt ß (Schweizer Schreibweise)

Wenn mehrere Kinder genannt werden, erwähne alle ausgewogen in der Geschichte.
Baue die Moral sanft ein, ohne zu belehrend zu wirken.

WICHTIG für alle genannten Charaktere:
- "Aktive Mitspieler" und "Aktive Begleitpersonen" sind VOLLWERTIGE Figuren in der Geschichte.
- Sie erleben Dinge mit, sprechen, helfen, machen Witze oder tragen die Handlung aktiv voran.
- Sie dürfen NICHT nur kurz am Anfang oder Ende erwähnt werden – sie sind von Anfang bis Ende präsent und handeln.
- Verteile ihre Rollen sinnvoll: jede Person hat mindestens einen eigenen Moment oder eine eigene Aktion in der Geschichte.

WICHTIG für Verwandtschaftsbeziehungen:
- Bei "Geschwister": Prüfe den Namen und wähle "Bruder" für Jungennamen (Max, Leo, Tim, Noah, etc.) oder "Schwester" für Mädchennamen (Lina, Emma, Mia, Sophie, etc.)
- Ebenso bei anderen Beziehungen: Opa/Oma, Onkel/Tante, Cousin/Cousine, Freund/Freundin
- Im Zweifel: Verwende neutrale Begriffe oder den Namen direkt`

        const developerPrompt = `Antworte NUR with validem JSON im folgenden Format:
{
  "title": "Titel der Geschichte",
  "reading_time_minutes": 5,
  "story": [
    { "text": "Erster Absatz...", "scene_marker": true, "image_prompt": "warm cozy bedroom, soft lighting, Pixar style, 3D animated" },
    { "text": "Zweiter Absatz..." },
    { "text": "Dritter Absatz mit neuer Szene...", "scene_marker": true, "image_prompt": "magical forest at twilight, fireflies, dreamy atmosphere, Pixar style" }
  ],
  "moral_summary": "Kurze Zusammenfassung der Botschaft oder Moral der Geschichte in einem einzigen Satz (IMMER befüllen, auch wenn keine explizite Moral vorgegeben wurde)"
}

Regeln fuer image_prompt:
- Englisch, max 100 Woerter
- Stil: "warm, soft, 3D animated, Pixar style, cozy, dreamy lighting"
- Keine Texte, keine Marken, keine realen Personen
- Zeige Szene, nicht spezifische Kinder (ausser bei niedrigen Altern)
- 3-6 scene_marker je nach Laenge`

        // 4. Call OpenAI GPT-4o
        console.log("Calling OpenAI GPT-4o...")

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "developer", content: developerPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            max_tokens: 8000,
            temperature: 0.7,
        })

        const rawContent = completion.choices[0].message.content
        if (!rawContent) throw new Error("No content in OpenAI response")

        const storyContent = JSON.parse(rawContent)

        // Validate story structure
        if (!storyContent.title || !storyContent.story || !Array.isArray(storyContent.story)) {
            throw new Error("Invalid story structure from OpenAI")
        }

        // Calculate actual reading time based on word count
        const wordCount = storyContent.story.reduce((sum: number, p: any) =>
            sum + (p.text?.split(/\s+/).length || 0), 0
        )
        const calculatedReadingTime = Math.ceil(wordCount / 130) // ~130 words/min

        console.log(`Story generated: ${wordCount} words, ~${calculatedReadingTime} min reading time`)

        // 5. Create story record
        const { data: story, error: storyError } = await supabase
            .from("stories")
            .insert({
                user_id: request.user_id,
                request_id: request_id,
                title: storyContent.title,
                content: storyContent,
                reading_time_minutes: calculatedReadingTime,
            })
            .select()
            .single()

        if (storyError) throw storyError

        // 6. Link children to story
        const storyChildInserts = children.map((c: any) => ({
            story_id: story.id,
            child_id: c.id,
        }))
        await supabase.from("story_children").insert(storyChildInserts)

        // 7. Extract scenes for image generation (max 5 images)
        const MAX_IMAGES = 5
        const scenes = storyContent.story
            .filter((p: any) => p.scene_marker && p.image_prompt)
            .slice(0, MAX_IMAGES)
            .map((p: any, index: number) => ({
                story_id: story.id,
                scene_index: index,
                image_prompt: p.image_prompt,
            }))

        if (scenes.length > 0) {
            await supabase.from("story_scenes").insert(scenes)
        }

        // 8. Trigger async image generation (if enabled)
        const shouldGenerateImages = request.generate_images !== false
        console.log(`Image generation check: shouldGenerateImages=${shouldGenerateImages}, generate_images=${request.generate_images}`)

        if (shouldGenerateImages && scenes.length > 0) {
            // Call generate-images function asynchronously (don't await!)
            supabase.functions.invoke('generate-images', {
                body: {
                    story_id: story.id,
                    request_id: request_id
                },
            }).catch(err => {
                console.error('Error triggering image generation:', err)
            })

            console.log(`Triggered async image generation for ${scenes.length} scenes`)
        } else {
            console.log("Image generation skipped (user opted out or no scenes)")

            // If no images to generate, mark as finished immediately
            await supabase
                .from("story_requests")
                .update({
                    status: "finished",
                    completed_at: new Date().toISOString()
                })
                .eq("id", request_id)
        }

        // 9. Send push notification only if NO images are being generated
        // If images are being generated, the notification will be sent by generate-images function
        if (request.notify_on_complete && (!shouldGenerateImages || scenes.length === 0)) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("push_token")
                .eq("id", request.user_id)
                .single()

            if (profile?.push_token) {
                try {
                    await fetch("https://exp.host/--/api/v2/push/send", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                        },
                        body: JSON.stringify({
                            to: profile.push_token,
                            title: "Geschichte fertig! 📖",
                            body: "Deine Gute-Nacht-Geschichte ist bereit zum Vorlesen.",
                            data: { story_id: story.id },
                            sound: "default",
                            priority: "high",
                        }),
                    })
                } catch (pushError) {
                    console.error("Push notification error:", pushError)
                }
            }
        }

        return new Response(
            JSON.stringify({ success: true, story_id: story.id, scenes_count: scenes.length }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error: any) {
        console.error("Error in create-story:", error)

        if (request_id) {
            try {
                const supabase = createClient(
                    Deno.env.get("SUPABASE_URL")!,
                    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
                )

                const { data: failedRequest } = await supabase
                    .from("story_requests")
                    .select("user_id")
                    .eq("id", request_id)
                    .single()

                await supabase
                    .from("story_requests")
                    .update({
                        status: "failed",
                        error_message: error.message,
                        completed_at: new Date().toISOString()
                    })
                    .eq("id", request_id)

                console.log(`Updated request ${request_id} status to failed`)

                if (failedRequest?.user_id) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("push_token")
                        .eq("id", failedRequest.user_id)
                        .single()

                    if (profile?.push_token) {
                        await fetch("https://exp.host/--/api/v2/push/send", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Accept": "application/json",
                            },
                            body: JSON.stringify({
                                to: profile.push_token,
                                title: "Fehler bei Geschichte ❌",
                                body: "Die Geschichte konnte leider nicht erstellt werden. Bitte versuche es erneut.",
                                data: { request_id: request_id, error: true },
                                sound: "default",
                                priority: "high",
                            }),
                        })
                    }
                }
            } catch (updateError) {
                console.error("Error updating failed status:", updateError)
            }
        }

        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
