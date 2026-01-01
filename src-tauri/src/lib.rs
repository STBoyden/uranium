use std::path::PathBuf;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use os_info::Type;
use serde::{Deserialize, Serialize};
use steamlocate::SteamDir;

const MW3_APP_ID: u32 = 115300;
const BO2_APP_ID: u32 = 202970;
const BO2_MP_APP_ID: u32 = 202990;
const BO1_APP_ID: u32 = 42700;
const BO1_MP_APP_ID: u32 = 42710;
const WAW_APP_ID: u32 = 10090;

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
enum RequirementState {
    Met,
    NotMet { message: String },
}

#[derive(Debug, Serialize, Deserialize)]
struct Requirements {
    all_met: bool,
    operating_system: RequirementState,
    architecture: RequirementState,
    steam: RequirementState,
    mw3_path: Option<PathBuf>,
    bo2_path: Option<PathBuf>,
    bo2_mp_path: Option<PathBuf>,
    bo1_path: Option<PathBuf>,
    bo1_mp_path: Option<PathBuf>,
    waw_path: Option<PathBuf>,
}

impl Requirements {
    fn new(
        operating_system: RequirementState,
        architecture: RequirementState,
        steam_installed: RequirementState,
        mw3_path: Option<PathBuf>,
        bo2_path: Option<PathBuf>,
        bo2_mp_path: Option<PathBuf>,
        bo1_path: Option<PathBuf>,
        bo1_mp_path: Option<PathBuf>,
        waw_path: Option<PathBuf>,
    ) -> Self {
        let all_met = [&operating_system, &architecture, &steam_installed]
            .iter()
            .all(|x| x == &&RequirementState::Met);

        Self {
            all_met,
            operating_system,
            architecture,
            steam: steam_installed,
            mw3_path,
            bo2_path,
            bo2_mp_path,
            bo1_path,
            bo1_mp_path,
            waw_path,
        }
    }
}

#[tauri::command]
fn get_operating_system_type() -> &'static str {
    #[cfg(target_os = "linux")]
    {
        "Linux"
    }
    #[cfg(target_os = "windows")]
    {
        "Windows"
    }
    #[cfg(target_os = "macos")]
    {
        "MacOS"
    }
}

fn get_app_path(steam_dir: &Option<SteamDir>, app_id: u32) -> Option<PathBuf> {
    let steam_dir = steam_dir.clone()?;

    steam_dir.find_app(app_id).ok()??.0.launcher_path
}

#[tauri::command]
fn get_requirements() -> Requirements {
    let os_info = os_info::get();
    let os_name = get_operating_system_type();
    let steam_dir = SteamDir::locate().ok();

    Requirements::new(
        if os_info.os_type() == Type::Linux {
            RequirementState::Met
        } else {
            RequirementState::NotMet { message: format!("The current operating system ({os_name}) is not supported - <u>Linux is required</u>. If you're using Windows, please use the <a tabindex=\"9999\" target=\"_blank\" href=\"https://plutonium.pw/\">Plutonium Launcher</a> instead.") }
        },
        if matches!(os_info.architecture(), Some("x86_64")) {
            RequirementState::Met
        } else {
            let arch = os_info.architecture().unwrap_or("unknown");
            RequirementState::NotMet { message: format!("The current operating system architecture ({arch}) is not supported. The only supported architecture is x86_64 (the standard for Intel and AMD CPUs)." ) }
        },
        if steam_dir.is_some() {
            RequirementState::Met
        } else {
            RequirementState::NotMet {
                message: "Steam is not installed or could not be found. If you are sure Steam is installed, please make sure that it has been ran at least once.".to_string(),
            }
        },
        get_app_path(&steam_dir, MW3_APP_ID),
        get_app_path(&steam_dir, BO2_APP_ID),
        get_app_path(&steam_dir, BO2_MP_APP_ID),
        get_app_path(&steam_dir, BO1_APP_ID),
        get_app_path(&steam_dir, BO1_MP_APP_ID),
        get_app_path(&steam_dir, WAW_APP_ID),
    )
}

#[tauri::command]
fn is_setup() -> bool {
    // check if setup?
    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_gamepad::init())
        .invoke_handler(tauri::generate_handler![
            get_operating_system_type,
            get_requirements,
            is_setup
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
