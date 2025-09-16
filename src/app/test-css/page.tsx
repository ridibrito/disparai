export default function TestCSS() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        color: '#333', 
        fontSize: '24px', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        Teste de CSS - Central WhatsApp
      </h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '20px',
        maxWidth: '800px',
        margin: '0 auto 20px auto'
      }}>
        <h2 style={{ 
          color: '#25D366', 
          fontSize: '18px', 
          marginBottom: '10px' 
        }}>
          Seção de Conexões WhatsApp
        </h2>
        <p style={{ 
          color: '#666', 
          marginBottom: '15px' 
        }}>
          Esta é uma seção de teste para verificar se o CSS está funcionando.
        </p>
        <button 
          onClick={() => alert('Botão funcionando!')}
          style={{ 
            backgroundColor: '#25D366', 
            color: 'white', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '6px', 
            cursor: 'pointer'
          }}
        >
          Botão de Teste
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#25D366', 
        color: 'white', 
        padding: '15px', 
        borderRadius: '8px',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <p style={{ margin: '0' }}>
          ✅ Se você conseguir ver este texto com fundo verde, o CSS está funcionando!
        </p>
      </div>

      <div style={{ 
        marginTop: '20px',
        textAlign: 'center'
      }}>
        <a 
          href="/configuracoes/central-whatsapp"
          style={{
            color: '#25D366',
            textDecoration: 'none',
            fontSize: '16px'
          }}
        >
          ← Voltar para Central WhatsApp
        </a>
      </div>
    </div>
  );
}
