import { ConfiguratorShell } from './ConfiguratorShell';

export default async function ConfigurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConfiguratorShell productId={id} />;
}
