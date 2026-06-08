export default function getFullImageUrl(src) {
  if (!src) return src;
  if (src.startsWith('http')) return src;
  // Backend serves uploads at http://localhost:5000/uploads/...
  return `http://localhost:5000${src}`;
}
