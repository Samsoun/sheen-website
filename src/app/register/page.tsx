import RegisterForm from '@/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="login-container">
      <div className="w-full max-w-2xl mx-auto px-6">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Account erstellen</h1>
            <p className="login-subtitle">Erstellen Sie Ihren persönlichen Kundenaccount</p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
