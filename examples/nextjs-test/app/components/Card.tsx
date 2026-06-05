export interface CardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonVariant?: "primary";
}

export default function Card({ title, description, buttonText, buttonVariant }: CardProps) {
  return (
    <div className="card">
      <h2 style={{ color: "blue" }}>{title}</h2>
      <p style={{ color: "blue" }}>{description}</p>
      <button
        className={buttonVariant ? `btn ${buttonVariant}` : "btn"}
        style={{ color: "pink" }}
      >
        {buttonText}
      </button>
    </div>
  );
}
