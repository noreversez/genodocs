using System;
using System.Text;
using System.Net;
using System.Threading;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.IO;

namespace ThaiSmartCardAgent
{
    class Program
    {
        [DllImport("winscard.dll")]
        public static extern int SCardEstablishContext(uint dwScope, IntPtr pvReserved1, IntPtr pvReserved2, out IntPtr phContext);

        [DllImport("winscard.dll", EntryPoint = "SCardListReadersA", CharSet = CharSet.Ansi)]
        public static extern int SCardListReaders(IntPtr hContext, byte[] mszGroups, byte[] mszReaders, ref uint pcchReaders);

        [DllImport("winscard.dll")]
        public static extern int SCardConnect(IntPtr hContext, string szReader, uint dwShareMode, uint dwPreferredProtocols, out IntPtr phCard, out uint pdwActiveProtocol);

        [DllImport("winscard.dll")]
        public static extern int SCardTransmit(IntPtr hCard, IntPtr pioSendPci, byte[] pbSendBuffer, uint cbSendLength, IntPtr pioRecvPci, byte[] pbRecvBuffer, ref uint pcbRecvLength);

        [DllImport("winscard.dll")]
        public static extern int SCardDisconnect(IntPtr hCard, uint dwDisposition);

        [DllImport("winscard.dll")]
        public static extern int SCardReleaseContext(IntPtr hContext);

        static IntPtr SCARD_PCI_T0 = GetPciT0();
        static IntPtr SCARD_PCI_T1 = GetPciT1();

        static IntPtr GetPciT0()
        {
            IntPtr handle = LoadLibrary("winscard.dll");
            IntPtr pci = GetProcAddress(handle, "g_rgSCardT0Pci");
            FreeLibrary(handle);
            return pci;
        }

        static IntPtr GetPciT1()
        {
            IntPtr handle = LoadLibrary("winscard.dll");
            IntPtr pci = GetProcAddress(handle, "g_rgSCardT1Pci");
            FreeLibrary(handle);
            return pci;
        }

        [DllImport("kernel32.dll")]
        public static extern IntPtr LoadLibrary(string dllToLoad);
        [DllImport("kernel32.dll")]
        public static extern IntPtr GetProcAddress(IntPtr hModule, string procedureName);
        [DllImport("kernel32.dll")]
        public static extern bool FreeLibrary(IntPtr hModule);

        static byte[] SendAPDU(IntPtr hCard, byte[] apdu)
        {
            byte[] recvBuffer = new byte[256];
            uint recvLength = (uint)recvBuffer.Length;
            int ret = SCardTransmit(hCard, SCARD_PCI_T0, apdu, (uint)apdu.Length, IntPtr.Zero, recvBuffer, ref recvLength);
            if (ret != 0) return null;
            byte[] result = new byte[recvLength];
            Array.Copy(recvBuffer, result, recvLength);
            return result;
        }

        static string ReadData(IntPtr hCard, byte[] cmd)
        {
            byte[] res = SendAPDU(hCard, cmd);
            if (res == null || res.Length < 2) return "";
            Encoding tis620 = Encoding.GetEncoding(874);
            return tis620.GetString(res, 0, res.Length - 2).Trim();
        }

        static string ReadSmartCardData()
        {
            IntPtr hContext;
            if (SCardEstablishContext(2, IntPtr.Zero, IntPtr.Zero, out hContext) != 0)
                return "{\"error\":\"Cannot establish PC/SC context\"}";

            uint pcchReaders = 0;
            SCardListReaders(hContext, null, null, ref pcchReaders);
            byte[] mszReaders = new byte[pcchReaders];
            if (SCardListReaders(hContext, null, mszReaders, ref pcchReaders) != 0)
                return "{\"error\":\"No reader found\"}";

            string readerName = Encoding.ASCII.GetString(mszReaders).TrimEnd('\0');
            if (string.IsNullOrEmpty(readerName))
                return "{\"error\":\"No reader found\"}";

            IntPtr hCard;
            uint activeProtocol;
            if (SCardConnect(hContext, readerName, 2, 3, out hCard, out activeProtocol) != 0)
                return "{\"error\":\"Cannot connect to card (Card may not be inserted)\"}";

            byte[] SELECT = { 0x00, 0xA4, 0x04, 0x00, 0x08, 0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01 };
            SendAPDU(hCard, SELECT);

            byte[] GET_CID = { 0x80, 0xB0, 0x00, 0x04, 0x02, 0x00, 0x0D };
            byte[] GET_FULLNAME = { 0x80, 0xB0, 0x00, 0x11, 0x02, 0x00, 0x64 };
            byte[] GET_DOB = { 0x80, 0xB0, 0x00, 0xD5, 0x02, 0x00, 0x08 };
            byte[] GET_ADDRESS = { 0x80, 0xB0, 0x15, 0x79, 0x02, 0x00, 0x64 };

            string cid = ReadData(hCard, GET_CID);
            string fullName = ReadData(hCard, GET_FULLNAME);
            string dob = ReadData(hCard, GET_DOB);
            string address = ReadData(hCard, GET_ADDRESS);

            SCardDisconnect(hCard, 0);
            SCardReleaseContext(hContext);

            string[] names = fullName.Replace("  ", " ").Split('#');
            string title = names.Length > 0 ? names[0].Trim() : "";
            string fname = names.Length > 1 ? names[1].Trim() : "";
            string lname = names.Length > 3 ? names[3].Trim() : "";
            
            string fullAddr = address.Replace("#", " ").Trim();
            
            string dobFmt = "";
            if (dob.Length == 8) {
                dobFmt = string.Format("{0}-{1}-{2}", dob.Substring(0,4), dob.Substring(4,2), dob.Substring(6,2));
            }

            string json = string.Format(@"{{
                ""citizenId"": ""{0}"",
                ""title"": ""{1}"",
                ""name"": ""{2} {3}"",
                ""dob"": ""{4}"",
                ""address"": ""{5}""
            }}", cid, title, fname, lname, dobFmt, fullAddr);

            return json.Replace("\r", "").Replace("\n", "");
        }

        static string templatesDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "Templates");
        static string exportDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "ExportedLogs");

        static void EnsureDirectories() {
            if (!Directory.Exists(templatesDir)) Directory.CreateDirectory(templatesDir);
            if (!Directory.Exists(exportDir)) Directory.CreateDirectory(exportDir);
        }

        static void Main(string[] args)
        {
            EnsureDirectories();

            Console.WriteLine("Thai Smart Card & File Agent starting on http://localhost:8080/");
            HttpListener listener = new HttpListener();
            listener.Prefixes.Add("http://localhost:8080/");
            try {
                listener.Start();
            } catch (HttpListenerException) {
                Console.WriteLine("Error: Access denied. You may need to run as Administrator, or change the port.");
                Console.ReadLine();
                return;
            }
            
            Console.WriteLine("Agent is running! Web application can now communicate with it.");
            Console.WriteLine("Press Ctrl+C to stop the agent.");

            while (true)
            {
                var context = listener.GetContext();
                var request = context.Request;
                var response = context.Response;
                response.AppendHeader("Access-Control-Allow-Origin", "*");
                
                if (request.HttpMethod == "OPTIONS") {
                    response.AppendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                    response.AppendHeader("Access-Control-Allow-Headers", "*");
                    response.StatusCode = 200;
                    response.Close();
                    continue;
                }
                
                string path = request.Url.AbsolutePath;
                string result = "";
                byte[] buffer = null;

                try {
                    if (path == "/" || path == "/smartcard") {
                        result = ReadSmartCardData();
                    }
                    else if (path == "/templates") {
                        string[] files = Directory.GetFiles(templatesDir, "*.docx");
                        var fileNames = new List<string>();
                        foreach(var f in files) fileNames.Add("\"" + Path.GetFileName(f).Replace("\"", "\\\"") + "\"");
                        result = "[" + string.Join(",", fileNames.ToArray()) + "]";
                    }
                    else if (path == "/templates/read") {
                        string name = request.QueryString["name"];
                        if (string.IsNullOrEmpty(name)) throw new Exception("No name provided");
                        string filePath = Path.Combine(templatesDir, name);
                        if (!File.Exists(filePath)) throw new Exception("File not found");
                        byte[] fileBytes = File.ReadAllBytes(filePath);
                        result = "{\"base64\":\"" + Convert.ToBase64String(fileBytes) + "\"}";
                    }
                    else if (path == "/templates/open") {
                        string name = request.QueryString["name"];
                        if (string.IsNullOrEmpty(name)) throw new Exception("No name provided");
                        string filePath = Path.Combine(templatesDir, name);
                        if (File.Exists(filePath)) {
                            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo() {
                                FileName = filePath,
                                UseShellExecute = true
                            });
                            result = "{\"status\":\"ok\"}";
                        } else throw new Exception("File not found");
                    }
                    else if (path == "/templates/openFolder") {
                        System.Diagnostics.Process.Start("explorer.exe", templatesDir);
                        result = "{\"status\":\"ok\"}";
                    }
                    else if (path == "/export" && request.HttpMethod == "POST") {
                        string name = request.QueryString["name"];
                        if (string.IsNullOrEmpty(name)) name = "Export_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".docx";
                        
                        string filePath = Path.Combine(exportDir, name);
                        using (var fs = new FileStream(filePath, FileMode.Create)) {
                            request.InputStream.CopyTo(fs);
                        }
                        
                        System.Diagnostics.Process.Start("explorer.exe", "/select,\"" + filePath + "\"");
                        result = "{\"status\":\"ok\"}";
                    }
                    else {
                        result = "{\"error\":\"Unknown endpoint\"}";
                        response.StatusCode = 404;
                    }
                } catch (Exception ex) {
                    result = "{\"error\":\"" + ex.Message.Replace("\"", "'").Replace("\r", "").Replace("\n", "") + "\"}";
                    response.StatusCode = 500;
                }

                if (buffer == null) buffer = Encoding.UTF8.GetBytes(result);
                response.ContentLength64 = buffer.Length;
                response.ContentType = "application/json";
                var output = response.OutputStream;
                output.Write(buffer, 0, buffer.Length);
                output.Close();
            }
        }
    }
}
