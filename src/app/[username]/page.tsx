export const dynamic = "";

type Props = {
  params: {
    username: string;
  };
};

export async function ProfilePage({ params }: Props) {
  const { username } = params;

  return (
    <div>
      <h1>Profile Page</h1>
    </div>
  );
}
