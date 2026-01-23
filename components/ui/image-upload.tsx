"use client";

import { useState } from "react";
import { IKContext, IKUpload } from "imagekitio-react";
import { Loader2, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  onRemove: (value: string) => void;
}

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

const authenticator = async () => {
  try {
    const response = await fetch("/api/upload/auth");

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const { signature, expire, token } = data;
    return { signature, expire, token };
  } catch (error) {
    throw new Error(`Authentication request failed: ${error}`);
  }
};

export const ImageUpload = ({
  value,
  onChange,
  onRemove,
}: ImageUploadProps) => {
  const [loading, setLoading] = useState(false);

  const onError = (err: any) => {
    console.log("Error", err);
    toast.error("Image upload failed.");
    setLoading(false);
  };

  const onSuccess = (res: any) => {
    console.log("Success", res);
    onChange([...value, res.url]);
    setLoading(false);
    toast.success("Image uploaded successfully.");
  };

  const onUploadStart = () => {
    setLoading(true);
  };

  return (
    <IKContext
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
      <div className="mb-4 flex items-center gap-4">
        {value.map((url) => (
          <div
            key={url}
            className="relative w-[200px] h-[200px] rounded-md overflow-hidden"
          >
            <div className="z-10 absolute top-2 right-2">
              <Button
                type="button"
                onClick={() => onRemove(url)}
                variant="destructive"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Image
              fill
              className="object-cover"
              alt="Image"
              src={url}
            />
          </div>
        ))}
      </div>
      <div>
        {loading && (
            <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
            </div>
        )}
        <IKUpload
          fileName="car-image.png"
          onError={onError}
          onSuccess={onSuccess}
          onUploadStart={onUploadStart}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        />
      </div>
    </IKContext>
  );
};
