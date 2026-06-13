import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import getCroppedImg from '../lib/cropImage';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedFile: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel, aspectRatio = 3 / 4 }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onCropCompleteEvent = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const showCroppedImage = async () => {
    try {
      if (!croppedAreaPixels) return;
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        0
      );
      if (croppedImage) {
          onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
      alert('Error recortando la imagen');
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-offwhite rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col border border-earth/20 h-[80vh]">
        <div className="bg-earth text-offwhite p-4 flex justify-between items-center z-10">
          <h3 className="font-brand text-xl">Ajustar Imagen</h3>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative flex-1 bg-black/5">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteEvent}
            onZoomChange={onZoomChange}
            classes={{
                containerClassName: "custom-cropper-container"
            }}
          />
        </div>

        <div className="p-6 bg-offwhite border-t border-earth/10 flex flex-col sm:flex-row items-center gap-4 justify-between z-10">
          <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
             <span className="text-xs uppercase tracking-widest text-earth/70 font-bold">Zoom</span>
             <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => {
                setZoom(Number(e.target.value));
              }}
              className="zoom-range flex-1 max-w-[200px]"
            />
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
                onClick={onCancel}
                className="flex-1 sm:flex-none px-6 py-3 text-earth border border-earth/20 rounded-full uppercase tracking-widest text-xs font-bold hover:bg-earth/5 transition-colors"
                disabled={isProcessing}
            >
                Cancelar
            </button>
            <button 
                onClick={showCroppedImage}
                className="flex-1 sm:flex-none px-6 py-3 bg-earth hover:bg-kraft text-offwhite rounded-full uppercase tracking-widest text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                disabled={isProcessing}
            >
                <Check size={16} /> {isProcessing ? 'Procesando...' : 'Aplicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
