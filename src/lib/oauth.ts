// 간편 로그인(OAuth 2.0 인가코드 흐름) 제공자 레지스트리.
// 외부 라이브러리 없이 fetch로 토큰 교환·userinfo 조회를 수행한다.
// client id/secret은 서버 환경변수에만 보관한다. (CLAUDE.md)

export type ProviderId = "google" | "kakao" | "naver";

export type OAuthProfile = {
  providerAccountId: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

type ProviderConfig = {
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  // Kakao는 콘솔에서 "Client Secret 사용"을 켰을 때만 secret이 필요하다(기본 선택).
  // Google/Naver는 secret이 필수다.
  requiresSecret: boolean;
  clientId: () => string | undefined;
  clientSecret: () => string | undefined;
  parseProfile: (raw: unknown) => OAuthProfile;
};

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// 제공자 콜백 URL. 각 제공자 콘솔에 동일하게 등록해야 한다.
export function redirectUri(provider: ProviderId): string {
  return `${appUrl()}/api/auth/oauth/${provider}/callback`;
}

const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    scope: "openid email profile",
    requiresSecret: true,
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    parseProfile: (raw) => {
      const u = raw as {
        id?: string;
        email?: string;
        name?: string;
        picture?: string;
      };
      return {
        providerAccountId: String(u.id ?? ""),
        email: u.email ?? null,
        name: u.name ?? null,
        image: u.picture ?? null,
      };
    },
  },
  kakao: {
    authorizeUrl: "https://kauth.kakao.com/oauth/authorize",
    tokenUrl: "https://kauth.kakao.com/oauth/token",
    userInfoUrl: "https://kapi.kakao.com/v2/user/me",
    scope: "account_email profile_nickname profile_image",
    requiresSecret: false, // Kakao는 secret 미사용(기본)에도 동작
    clientId: () => process.env.KAKAO_CLIENT_ID,
    clientSecret: () => process.env.KAKAO_CLIENT_SECRET,
    parseProfile: (raw) => {
      const u = raw as {
        id?: number | string;
        kakao_account?: {
          email?: string;
          profile?: { nickname?: string; profile_image_url?: string };
        };
      };
      const acc = u.kakao_account;
      return {
        providerAccountId: String(u.id ?? ""),
        email: acc?.email ?? null,
        name: acc?.profile?.nickname ?? null,
        image: acc?.profile?.profile_image_url ?? null,
      };
    },
  },
  naver: {
    authorizeUrl: "https://nid.naver.com/oauth2.0/authorize",
    tokenUrl: "https://nid.naver.com/oauth2.0/token",
    userInfoUrl: "https://openapi.naver.com/v1/nid/me",
    scope: "",
    requiresSecret: true,
    clientId: () => process.env.NAVER_CLIENT_ID,
    clientSecret: () => process.env.NAVER_CLIENT_SECRET,
    parseProfile: (raw) => {
      const u = raw as {
        response?: {
          id?: string;
          email?: string;
          name?: string;
          nickname?: string;
          profile_image?: string;
        };
      };
      const r = u.response;
      return {
        providerAccountId: String(r?.id ?? ""),
        email: r?.email ?? null,
        name: r?.nickname ?? r?.name ?? null,
        image: r?.profile_image ?? null,
      };
    },
  },
};

export function isProviderId(value: string): value is ProviderId {
  return value === "google" || value === "kakao" || value === "naver";
}

// 설정 누락 여부 확인 (client id 필수, secret은 제공자별 요구사항에 따름)
export function getProvider(provider: ProviderId): {
  config: ProviderConfig;
  clientId: string;
  clientSecret: string | undefined;
} {
  const config = PROVIDERS[provider];
  const clientId = config.clientId();
  const clientSecret = config.clientSecret() || undefined;
  if (!clientId || (config.requiresSecret && !clientSecret)) {
    throw new Error(`${provider} OAuth 환경변수가 설정되지 않았습니다.`);
  }
  return { config, clientId, clientSecret };
}

// authorize URL을 생성한다.
export function buildAuthorizeUrl(provider: ProviderId, state: string): string {
  const { config, clientId } = getProvider(provider);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri(provider),
    state,
  });
  if (config.scope) params.set("scope", config.scope);
  return `${config.authorizeUrl}?${params.toString()}`;
}

// 인가 코드를 access token으로 교환한다.
async function exchangeCode(
  provider: ProviderId,
  code: string,
  state: string,
): Promise<string> {
  const { config, clientId, clientSecret } = getProvider(provider);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    redirect_uri: redirectUri(provider),
    state, // Naver는 토큰 교환에도 state를 요구한다.
  });
  // Kakao는 secret 미사용 시 client_secret을 보내지 않는다.
  if (clientSecret) body.set("client_secret", clientSecret);

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`토큰 교환 실패 (${res.status}): ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("access_token이 응답에 없습니다.");
  }
  return data.access_token;
}

// access token으로 사용자 프로필을 조회한다.
export async function fetchProfile(
  provider: ProviderId,
  code: string,
  state: string,
): Promise<OAuthProfile> {
  const { config } = getProvider(provider);
  const accessToken = await exchangeCode(provider, code, state);

  const res = await fetch(config.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`프로필 조회 실패 (${res.status}): ${detail.slice(0, 200)}`);
  }
  const raw = await res.json();
  const profile = config.parseProfile(raw);
  if (!profile.providerAccountId) {
    throw new Error("제공자 계정 ID를 확인할 수 없습니다.");
  }
  return profile;
}
