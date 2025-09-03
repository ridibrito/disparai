"use client";

import { toast } from "react-hot-toast";

type Options = {
  duration?: number;
};

function base(message: string, classes: string, { duration = 3000 }: Options = {}) {
  toast.custom(
    () => (
      <div className={`px-4 py-2 rounded-md shadow text-white text-sm ${classes}`}>{message}</div>
    ),
    { duration }
  );
}

export function showSuccessToast(message: string, opts?: Options) {
  base(message, "bg-green-600", opts);
}

export function showDangerToast(message: string, opts?: Options) {
  base(message, "bg-red-600", opts);
}

export function showInfoToast(message: string, opts?: Options) {
  base(message, "bg-gray-800", opts);
}


