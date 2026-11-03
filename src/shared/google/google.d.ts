/**
 * Kiểu tối thiểu của Google Identity Services (script https://accounts.google.com/gsi/client) —
 * chỉ phần app dùng: nút Google trả ID token.
 */
declare namespace google.accounts.id {
  interface CredentialResponse {
    /** JWT ID token */
    credential: string;
    select_by?: string;
  }

  interface IdConfiguration {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    ux_mode?: 'popup' | 'redirect';
    itp_support?: boolean;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }

  interface GsiButtonConfiguration {
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    width?: number;
    logo_alignment?: 'left' | 'center';
    locale?: string;
  }

  function initialize(config: IdConfiguration): void;
  function renderButton(parent: HTMLElement, options: GsiButtonConfiguration): void;
  function prompt(): void;
  function cancel(): void;
}
