import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FenceOrder } from "@/components/FenceOrder";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Заказ ограждения и ворот — конфигуратор" },
      { name: "description", content: "Анкета-калькулятор для заказа секций забора, калиток, распашных и откатных ворот." },
      { property: "og:title", content: "Заказ ограждения и ворот — конфигуратор" },
      { property: "og:description", content: "Соберите заказ ограждения: секции, калитка, распашные и откатные ворота." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  // The form restores a saved draft from the browser, so render it only after hydration.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? <FenceOrder /> : <main className="app-shell" />;
}
