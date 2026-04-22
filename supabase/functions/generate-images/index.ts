// Follow this type convention:
// https://supabase.com/docs/guides/functions/typescript

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface GenerateImagesRequest {
    story_id: string
    request_id?: string
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        const falApiKey = Deno.env.get("FAL_API_KEY")

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { story_id, request_id } = await req.json() as GenerateImagesRequest

        console.log(`Starting image generation for story ${story_id}`)
        console.log(`FAL_API_KEY present: ${!!falApiKey}, length: ${falApiKey?.length || 0}`)

        if (!falApiKey) {
            console.error("ERROR: FAL_API_KEY is not set in environment variables! Images cannot be generated.")
            throw new Error("FAL_API_KEY is missing - please configure it in Edge Function secrets")
        }

        // Update status to generating_images if request_id is provided
        // Also check if this is a series episode (to skip duplicate notification)
        let isEpisodeRequest = false
        if (request_id) {
            await supabase
                .from("story_requests")
                .update({ status: "generating_images" })
                .eq("id", request_id)

            const { data: reqData } = await supabase
                .from("story_requests")
                .select("is_episode")
                .eq("id", request_id)
                .single()
            isEpisodeRequest = !!reqData?.is_episode
        }

        // Get story details
        const { data: story, error: storyError } = await supabase
            .from("stories")
            .select("user_id, title")
            .eq("id", story_id)
            .single()

        if (storyError || !story) {
            throw new Error(`Story not found: ${story_id}`)
        }

        // Get scenes that need images
        const { data: scenesToProcess } = await supabase
            .from("story_scenes")
            .select("*")
            .eq("story_id", story_id)
            .is("image_url", null)
            .order("scene_index")

        console.log(`Scenes query result: ${scenesToProcess?.length || 0} scenes found for story ${story_id}`)

        if (!scenesToProcess || scenesToProcess.length === 0) {
            console.log("No scenes to process - marking as finished")
            if (request_id) {
                await supabase
                    .from("story_requests")
                    .update({ status: "finished", completed_at: new Date().toISOString() })
                    .eq("id", request_id)
            }
            return new Response(
                JSON.stringify({ success: true, message: "No scenes to process" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
        }

        // Get child photo for reference (if any)
        const { data: storyChildren } = await supabase
            .from("story_children")
            .select("child:children(photo_url)")
            .eq("story_id", story_id)

        const firstChildWithPhoto = storyChildren?.find((sc: any) => sc.child?.photo_url)
        const referenceImageUrl = firstChildWithPhoto?.child?.photo_url || null

        // Generate a consistent seed for all scenes in this story
        const storyBaseSeed = Math.floor(Math.random() * 2147483647)

        console.log(`Processing ${scenesToProcess.length} scenes SEQUENTIALLY to avoid timeout...`)
        console.log(`Reference image URL: ${referenceImageUrl || 'none'}`)

        // Helper function to process a single scene
        const processScene = async (scene: any) => {
            try {
                const falEndpoint = referenceImageUrl
                    ? "https://queue.fal.run/fal-ai/instant-character"
                    : "https://queue.fal.run/fal-ai/flux/schnell"

                const falRequestBody: any = {
                    prompt: scene.image_prompt + ", 3D animated, Pixar style, warm colors, children's book illustration, soft lighting, no text",
                    image_size: "square",
                    seed: storyBaseSeed + scene.scene_index,
                    num_inference_steps: 4, // Slightly more steps for better quality
                    output_format: "jpeg",
                    enable_safety_checker: true,
                }

                if (referenceImageUrl) {
                    falRequestBody.image_url = referenceImageUrl
                    falRequestBody.scale = 0.8
                }

                console.log(`Scene ${scene.scene_index}: Sending request to FAL...`)
                const imageResponse = await fetch(falEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Key ${falApiKey}`,
                    },
                    body: JSON.stringify(falRequestBody),
                })

                if (!imageResponse.ok) {
                    const errorText = await imageResponse.text()
                    console.error(`Scene ${scene.scene_index}: FAL request failed ${imageResponse.status}: ${errorText}`)
                    return
                }

                const queueData = await imageResponse.json()
                console.log(`Scene ${scene.scene_index}: Queued with ID ${queueData.request_id}`)

                if (!queueData.request_id) {
                    console.error(`Scene ${scene.scene_index}: No request_id in queue response`, JSON.stringify(queueData))
                    return
                }

                // Poll for result (max 25s per image to stay within timeout)
                let resultData = null
                let attempts = 0
                const maxAttempts = 25

                while (!resultData && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000))

                    const modelPath = referenceImageUrl ? 'instant-character' : 'flux/schnell'
                    const statusResponse = await fetch(
                        `https://queue.fal.run/fal-ai/${modelPath}/requests/${queueData.request_id}/status`,
                        { headers: { "Authorization": `Key ${falApiKey}` } }
                    )
                    const statusData = await statusResponse.json()
                    console.log(`Scene ${scene.scene_index}: Status after ${attempts + 1}s: ${statusData.status}`)

                    if (statusData.status === "COMPLETED") {
                        const resultResponse = await fetch(
                            `https://queue.fal.run/fal-ai/${modelPath}/requests/${queueData.request_id}`,
                            { headers: { "Authorization": `Key ${falApiKey}` } }
                        )
                        resultData = await resultResponse.json()
                        console.log(`Scene ${scene.scene_index}: COMPLETED after ${attempts + 1}s, images: ${resultData?.images?.length || 0}`)
                    } else if (statusData.status === "FAILED") {
                        console.error(`Scene ${scene.scene_index}: FAILED`, JSON.stringify(statusData))
                        return
                    }
                    attempts++
                }

                if (!resultData?.images?.[0]?.url) {
                    console.error(`Scene ${scene.scene_index}: No image URL after ${attempts} attempts. Result: ${JSON.stringify(resultData)}`)
                    return
                }

                const tempImageUrl = resultData.images[0].url
                console.log(`Scene ${scene.scene_index}: Downloading from ${tempImageUrl}`)
                const downloadResponse = await fetch(tempImageUrl)
                const imageBlob = await downloadResponse.blob()

                const fileName = `${story.user_id}/${story_id}/scene_${scene.scene_index}.jpg`
                const { error: uploadError } = await supabase.storage
                    .from("story-images")
                    .upload(fileName, imageBlob, {
                        contentType: "image/jpeg",
                        upsert: true,
                    })

                if (uploadError) {
                    console.error(`Scene ${scene.scene_index}: Upload error`, JSON.stringify(uploadError))
                    return
                }

                const { data: publicUrlData } = supabase.storage
                    .from("story-images")
                    .getPublicUrl(fileName)

                await supabase
                    .from("story_scenes")
                    .update({ image_url: publicUrlData.publicUrl })
                    .eq("id", scene.id)

                console.log(`Scene ${scene.scene_index}: Uploaded & saved successfully → ${publicUrlData.publicUrl}`)

            } catch (imgError: any) {
                console.error(`Scene ${scene.scene_index}: Unexpected error`, imgError?.message || imgError)
            }
        }

        // Process scenes SEQUENTIALLY to avoid Edge Function timeout
        for (const scene of scenesToProcess) {
            await processScene(scene)
        }
        console.log("All image processing complete")

        // Update status to finished
        if (request_id) {
            await supabase
                .from("story_requests")
                .update({ status: "finished", completed_at: new Date().toISOString() })
                .eq("id", request_id)
        }

        // Send push notification — only for single stories (not episodes)
        // For series episodes, generate-series-episode handles the notification
        if (!isEpisodeRequest) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("push_token")
                .eq("id", story.user_id)
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
                            body: `"${story.title}" ist bereit zum Vorlesen.`,
                            data: { story_id },
                            sound: "default",
                            priority: "high",
                        }),
                    })
                } catch (pushError) {
                    console.error("Push notification error:", pushError)
                }
            }
        } else {
            console.log("Skipping push notification for series episode (handled by generate-series-episode)")
        }

        return new Response(
            JSON.stringify({ success: true, story_id, scenes_processed: scenesToProcess.length }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error: any) {
        console.error("Error:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
