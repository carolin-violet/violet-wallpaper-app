/** react-native-manage-wallpaper 类型声明（库未自带类型） */
declare module 'react-native-manage-wallpaper' {
  export const TYPE: {
    HOME: number;
    LOCK: number;
    BOTH: number;
  };

  const ManageWallpaper: {
    setWallpaper: (
      source: { uri: string },
      callback: (res: { status: string; msg?: string; url?: string }) => void,
      type: number,
    ) => void;
  };
  export default ManageWallpaper;
}
