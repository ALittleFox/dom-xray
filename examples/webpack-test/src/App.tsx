import { RegisterForm } from "./components/RegisterForm";
import { RandomContent } from "./components/RandomContent";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-bold text-slate-900">
        Webpack Test - DOM Selector
      </h1>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <RegisterForm />
        <RandomContent />
      </div>
      <p className="text-sm text-slate-500">
        快捷键: macOS Cmd + Option / Windows Ctrl + Alt
      </p>
    </div>
  );
}
