export interface CardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonVariant?: "primary";
}

export default function Card({ title, description, buttonText, buttonVariant }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>{description}</p>
      <button className={buttonVariant ? `btn ${buttonVariant}` : "btn"}>
        {buttonText}
      </button>
    </div>
  );
}
