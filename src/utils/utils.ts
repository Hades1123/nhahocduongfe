export function exportFile(data: any, name?: string, type?: string) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name || "export"}.${type || "xlsx"}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
