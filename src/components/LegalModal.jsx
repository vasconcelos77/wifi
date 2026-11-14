import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function LegalModal({ type, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const isTerms = type === 'terms';

  return (
    <div
      className="upsell-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="upsell-modal legal-modal"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="upsell-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <h2 className="legal-title">{isTerms ? 'Termos de Uso' : 'Política de Privacidade'}</h2>

        <div className="legal-content">
          {isTerms ? (
            <>
              <h3>1. Visão Geral</h3>
              <p>O material “Atlas Visuais de Wi-Fi Residencial” é um produto digital educacional e de apoio técnico em formato PDF, desenvolvido para orientar auxiliares e instaladores em campo.</p>
              <h3>2. Licença e Uso</h3>
              <p>A compra concede uma licença de uso pessoal, intransferível e com acesso vitalício ao conteúdo em PDF. É estritamente proibida a redistribuição, revenda ou compartilhamento público dos arquivos.</p>
              <h3>3. Garantia</h3>
              <p>O produto possui garantia de 15 dias para reembolso integral, conforme as regras da plataforma de checkout utilizada na transação.</p>
            </>
          ) : (
            <>
              <h3>1. Coleta de Dados</h3>
              <p>Seus dados pessoais são processados estritamente pela plataforma de pagamento e checkout para validação da transação e envio do acesso ao material digital.</p>
              <h3>2. Segurança</h3>
              <p>Utilizamos protocolos seguros de criptografia e processamento de pagamentos para garantir total sigilo e proteção das suas informações.</p>
              <h3>3. Contato</h3>
              <p>Dúvidas sobre privacidade ou suporte ao cliente podem ser tratadas diretamente através dos canais oficiais indicados no checkout.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
