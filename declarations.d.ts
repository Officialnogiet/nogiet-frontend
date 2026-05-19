declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.md?raw' {
  const content: string;
  export default content;
}
