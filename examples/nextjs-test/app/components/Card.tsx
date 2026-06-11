export interface CardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonVariant?: "primary";
}

export default function Card({ title, description, buttonText, buttonVariant }: CardProps) {
  return (
    <div className="card">
      <h2 style={{ color: "red" }}>{title}</h2>
      <p style={{ color: "red" }}>{description}</p>
      <button
        className={buttonVariant ? `btn ${buttonVariant}` : "btn"}
        style={{ color: "red" }}
      >
        {buttonText}
      </button>
    </div>
  );
}
