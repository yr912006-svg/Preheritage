import ProductEditor from "../../ProductEditor";

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <ProductEditor productId={productId} />;
}
