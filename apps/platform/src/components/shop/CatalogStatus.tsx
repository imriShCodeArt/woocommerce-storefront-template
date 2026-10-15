import Alert from '@mui/material/Alert';

type CatalogStatusProps = {
  source?: 'sample' | 'woocommerce';
  unavailable?: boolean;
  sampleMessage: string;
  unavailableMessage: string;
};

export function CatalogStatus({
  source,
  unavailable = false,
  sampleMessage,
  unavailableMessage,
}: CatalogStatusProps) {
  if (unavailable) {
    return <Alert severity="warning">{unavailableMessage}</Alert>;
  }

  if (source === 'sample') {
    return <Alert severity="info">{sampleMessage}</Alert>;
  }

  return null;
}
