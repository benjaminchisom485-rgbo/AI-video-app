export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/plans',
      permanent: false,
    },
  };
}

export default function LoginPage() {
  return null;
}
