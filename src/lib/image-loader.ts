export default function imageLoader({ src }: { src: string }) {
  // For data URLs and blob URLs, return as is
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  
  // For regular URLs, return as is
  return src;
}