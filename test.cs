using System;
using System.IO;

class Program {
    static void Main() {
        string exportDir = ""C:\\Users\\NB\\.gemini\\antigravity\\scratch\\police-daily-log\\ExportedLogs"";
        string name = ""../smartcard-agent/Templates/test.doc"";
        string path = Path.Combine(exportDir, name);
        Console.WriteLine(Path.GetFullPath(path));
    }
}
