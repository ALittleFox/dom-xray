import Header from "./components/Header";
import Card from "./components/Card";

export default function Home() {
  return (
    <main className="container">
      <Header />

      <Card
        title="卡片 1"
        description="这是一个测试卡片。Command+点击这里试试。"
        buttonText="按钮 A"
      />

      <Card
        title="卡片 2"
        description="另一个测试卡片。"
        buttonText="按钮 B"
        buttonVariant="primary"
      />
    </main>
  );
}
