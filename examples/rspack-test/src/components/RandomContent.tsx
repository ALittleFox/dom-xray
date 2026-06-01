import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const randomParagraph = `在这个信息爆炸的时代，我们每天都被海量的数据所包围。从早晨醒来的第一条推送通知，到深夜睡前的最后一条社交媒体动态，信息如潮水般涌来。然而，真正有价值的内容却如同沙海中的珍珠，需要我们用心去筛选和发现。

技术的发展改变了我们获取信息的方式。搜索引擎让我们可以在几秒钟内找到想要的答案，人工智能助手则能够根据我们的兴趣推荐个性化的内容。但与此同时，信息过载也成为了一个不容忽视的问题。如何在浩瀚的信息海洋中保持清醒，找到真正对自己有用的知识，成为了现代人必须面对的挑战。

或许，我们需要学会放慢脚步，给自己留出思考的空间。在快节奏的生活中，偶尔停下来，静静地读一本书，或者深入地思考一个问题，可能会带来意想不到的收获。毕竟，真正的智慧不在于知道多少，而在于理解多少。`;

export function RandomContent() {
  const imageId = Math.floor(Math.random() * 1000);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>随机内容</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {randomParagraph}
        </p>
        <img
          src={`https://picsum.photos/seed/${imageId}/400/250`}
          alt="Mock 图片"
          className="w-full h-auto rounded-lg object-cover"
          loading="lazy"
        />
      </CardContent>
    </Card>
  );
}
