// Type declarations for CSS imports
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "maplibre-gl/dist/maplibre-gl.css" {
  const content: string;
  export default content;
}
