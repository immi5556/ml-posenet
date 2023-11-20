// See https://aka.ms/new-console-template for more information
using System.Text;
using Tesseract;
using Test.Ocr;

Console.WriteLine("Hello, World!");


new Test1().WordTest();

List<Pix> pics = new List<Pix>();
//using (var engine = new TesseractEngine(@"./tessdata", "eng+tam", EngineMode.Default))
//using (var engine = new TesseractEngine(@"./tessdata/tam", "tam", EngineMode.Default))
//{
//    //using (var img = Pix.LoadFromFile(@"./img_data/conv_ch_.png"))
//    //using (var img = Pix.LoadFromFile(@"./img_data/tamil_verse_.png")) //output is good, but console encode error
//    using (var img = Pix.LoadFromFile(@"./img_data/tamil_verse_slope.png")) //45 deg output 
//    //using (var img = Pix.LoadFromMemory .LoadFromFile(@"./img_data/tamil_verse_.png")) //output is good, but console encode error
//    {
//        int ii = 0;
//        var lvl = PageIteratorLevel.Word;
//        using (var page = engine.Process(img))
//        {
//            var iter = page.AnalyseLayout();
//            do
//            {
//                var px = iter.GetImage(lvl, 1, out int o, out int o1);
//                pics.Add(px);
//            }
//            while (iter.Next(lvl));
//        }
//        //using (var pages = engine.Process(img))
//        //{
//        //    using (var page = pages.AnalyseLayout())
//        //    {
//        //        page.Begin();
//        //        var props = page.GetProperties();
//        //        img.Rotate(props.DeskewAngle);
//        //        img.Save("chk_111.png");
//        //        do
//        //        {

//        //        }
//        //        while (page.Next(lvl));
//        //    }

//        //  var page = pages.GetIterator();
//        //foreach (var page in pages.GetIterator())
//        //{
//        //  var text = page.GetText();
//        //  var iter = page.AnalyseLayout();
//        //var rrect = page.GetSegmentedRegions(PageIteratorLevel.Word);
//        //var ee = page.GetTsvText(0); //error
//        //iter.Begin();
//        //do
//        //{
//        //    var props = iter.GetProperties();
//        //    var orientation = props.Orientation;
//        // Rotate image based on DeskewAngle (in radians)
//        //    pix.Rotate(props.DeskewAngle);
//        //iter.GetProperties().DeskewAngle;
//        //var px = iter.GetImage(PageIteratorLevel.Word, 0, out int o, out int o1);
//        //iter.GetProperties()
//        //px.Save((++ii).ToString() + ".png");
//        //    if (iter.TryGetBoundingBox(PageIteratorLevel.Word, out Rect rr))
//        //    {
//        //        Console.WriteLine("Rect Box" + rr);
//        //    }
//        //}
//        //while (iter.Next(PageIteratorLevel.Word));
//        //Console.WriteLine("Mean confidence: {0}", page.GetMeanConfidence());
//        //Console.WriteLine("Text (GetText): \r\n{0}", text);
//        //Console.WriteLine("Text (iterator):");
//        //}
//        //}
//    }
//}