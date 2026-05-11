import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900">
      <h1 className="text-4xl font-bold mb-4">JurisLeads</h1>
      <p className="text-lg text-gray-600 mb-8">Base do projeto configurada com sucesso!</p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button variant="default">Area do Cliente (CRM)</Button>
        </Link>
        <Link href="/captacao">
          <Button variant="outline">Site de Captação</Button>
        </Link>
      </div>
    </div>
  );
}
