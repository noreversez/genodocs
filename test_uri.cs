using System;
class Program {
    static void Main() {
        string q = "?name=%E0%B8%84%E0%B8%94%E0%B8%B5";
        Console.WriteLine(Uri.UnescapeDataString(q.Replace(""?name="", """")));
    }
}
