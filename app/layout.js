export const metadata = {
  title: {
    default: 'AI Video Studio',
    template: '%s | AI Video Studio',
  },
  description: 'Create AI videos and choose a plan that fits your workflow.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080b09',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
