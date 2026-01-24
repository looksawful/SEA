"use client";
import { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export const Skeleton = ({ className = "", ...props }: SkeletonProps) => (
  <div className={`skeleton bg-surface-3 rounded-xl ${className}`} {...props} />
);
