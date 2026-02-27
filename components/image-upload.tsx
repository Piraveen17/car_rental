"use client"

import { useState } from "react"
import { IKContext, IKUpload } from "imagekitio-react"
import { Button } from "@/components/ui/button"
import { Loader2, X, Upload } from "lucide-react"
import Image from "next/image"

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const authenticator = async () => {
  try {
    const response = await fetch("/api/auth/imagekit");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    const { signature, expire, token } = data;
    return { signature, expire, token };
  } catch (error: any) {
    throw new Error(`Authentication request failed: ${error.message}`);
  }
};

interface ImageUploadProps {
  bucket?: string // Kept for prop compatibility, but handled by IK folder path if needed
  defaultImages?: string[]
  onUploadComplete: (urls: string[]) => void
}

export function ImageUpload({ bucket = "car-images", defaultImages = [], onUploadComplete }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>(defaultImages)

  // Handlers for ImageKit
  const onError = (err: any) => {
    console.error("ImageKit Error:", err);
    setUploading(false);
    alert("Upload failed. Please try again.");
  };

  const onSuccess = (res: any) => {
    // res.url contains the accessible URL
    const newUrl = res.url;
    const updatedImages = [...images, newUrl];
    setImages(updatedImages);
    onUploadComplete(updatedImages);
    setUploading(false);
  };

  const onUploadStart = () => {
    setUploading(true);
  };


  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    onUploadComplete(updatedImages)
  }

  return (
    <IKContext 
      publicKey={publicKey} 
      urlEndpoint={urlEndpoint} 
      authenticator={authenticator}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          {images.map((url, index) => (
            <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border">
              <Image src={url} alt="Uploaded" fill className="object-cover" />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
            {/* Hidden IKUpload component, we channel clicks via the label/button below if needed 
                or just style the input directly. IKUpload renders an input type="file". 
                We can wrap it or hide it and trigger it. 
                However, IKUpload is a component that renders an input. 
                Let's style it or use the custom Upload button approach. 
            */}
            
            <IKUpload
              fileName="car_image.jpg"
              useUniqueFileName={true}
              folder={bucket}
              validateFile={(file: any) => file.size < 5000000} // 5MB limit example
              onError={onError}
              onSuccess={onSuccess}
              onUploadStart={onUploadStart}
              className="hidden" 
              id="ik-upload-input"
              // accept is not a prop on IKUpload in some versions, but usually it passes props to input
              // If it doesn't, we might need a Ref. But let's try standard mapping.
            />
            
           <Button asChild variant="outline" disabled={uploading}>
              <label htmlFor="ik-upload-input" className="cursor-pointer">
                 {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                    <Upload className="mr-2 h-4 w-4" />
                 )}
                 {uploading ? "Uploading..." : "Upload Images"}
              </label>
           </Button>
        </div>
      </div>
    </IKContext>
  )
}
