'use client';

import { useState } from 'react';

type VideoDialogProps = {
  videoSrc: string;
  thumbnailSrc?: string;
  thumbnailAlt?: string;
  buttonClassName?: string;
  buttonText?: string;
};

export default function VideoDialog({
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = 'Pré-visualização do vídeo',
  buttonClassName,
  buttonText = 'Ver demo',
}: VideoDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClassName || 'px-6 py-3 text-[#4bca59] border border-[#4bca59] rounded-md'}
      >
        {buttonText}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Thumbnail opcional */}
            {thumbnailSrc && (
              <img src={thumbnailSrc} alt={thumbnailAlt} className="absolute inset-0 w-full h-full object-cover" />
            )}
            <iframe
              src={videoSrc}
              title="Apresentação disparai"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-white/90 hover:text-white"
              aria-label="Fechar vídeo"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}


