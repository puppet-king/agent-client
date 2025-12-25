use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingRequest {
  pub value: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingResponse {
  pub value: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct StartVpnRequest {
    pub config: String, // 对应 Kotlin 里的 invoke.getString("config")
}

#[derive(Serialize, Deserialize)]
pub struct StartVpnResponse {
    pub status: String,
}

#[derive(Serialize, Deserialize)]
pub struct StopVpnResponse {
    pub status: String,
}