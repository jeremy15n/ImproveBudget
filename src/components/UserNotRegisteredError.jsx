export default function UserNotRegisteredError() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="text-center max-w-md p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500">Your account is not registered. Please contact an administrator.</p>
      </div>
    </div>
  );
}
