export default function LoadingSpinner({ text = 'Загрузка данных...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4" />
        <p className="text-gray-500">{text}</p>
      </div>
    </div>
  );
}
