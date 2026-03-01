interface ErrorMsgProps {
  message: string;
}

export function ErrorMsg({ message }: ErrorMsgProps) {
  return <p className="py-6 text-center text-sm text-red-400">{message}</p>;
}
