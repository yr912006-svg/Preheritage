import ProductEditor from "../../ProductEditor";

export default function EditProductPage({ params }: { params: { productId: string } }) {
  return <ProductEditor productId={params.productId} />;
}
