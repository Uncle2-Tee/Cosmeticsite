import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request) {
  const supabase = createServiceSupabaseClient();
  
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    
    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "File must be an image" }, { status: 400 });
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({ error: "Image file must be smaller than 5 MB" }, { status: 400 });
    }
    
    const buffer = await file.arrayBuffer();
    const filename = `${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, "-").toLowerCase()}`;
    const bucketPath = `product-images/${filename}`;
    
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(bucketPath, buffer, { contentType: file.type, upsert: false });
    
    if (uploadError) {
      if (uploadError.message.includes("Bucket not found")) {
        return Response.json({ error: "Storage not configured. Contact admin to set up Supabase Storage bucket 'product-images'." }, { status: 500 });
      }
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(bucketPath);
    
    return Response.json({ url: data.publicUrl });
  } catch (error) {
    console.error("Image upload error:", error);
    return Response.json({ error: error.message || "Failed to upload image" }, { status: 500 });
  }
}
