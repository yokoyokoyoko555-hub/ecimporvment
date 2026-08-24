export function needsDigimonSpReview(
  sourceType: string,
  variationCode: string,
  productName: string,
) {
  return (
    sourceType === "digimon" &&
    variationCode.toUpperCase() === "P2" &&
    !/【\s*SP\s*】/i.test(productName)
  );
}
