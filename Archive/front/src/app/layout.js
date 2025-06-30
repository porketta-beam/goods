import "./globals.css";

export const metadata = {
  title: "Bear Guard v0.0.1",
  description: "Bear Guard v.1.0.0",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
