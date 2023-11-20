using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Tesseract;

namespace Test.Ocr
{
    internal class Test1
    {
        public void WordTest()
        {
            List<Pix> pics = new List<Pix>();
            List<string> texts = new List<string>();
            List<string> o_texts = new List<string>();
            List<Rect> bb = new List<Rect>();
            var lvl = PageIteratorLevel.Word;
            //var src_img = @"./img_data/ch1.png";
            var src_img = @"./img_data/chq_9.png";
            //using (var engine = new TesseractEngine(@"./tessdata/tam", "tam", EngineMode.Default))
            using (var engine = new TesseractEngine(@"./tessdata/eng", "eng", EngineMode.Default))
            {
                using (var img = Pix.LoadFromFile(src_img))
                {
                    int ii = 0;
                    using (var page = engine.Process(img))
                    {
                        var iter = page.AnalyseLayout();
                        do
                        {
                            var px = iter.GetImage(lvl, 1, out int o, out int o1);
                            //px.Save((++ii).ToString() + ".png");
                            pics.Add(px);
                            if (iter.TryGetBoundingBox(PageIteratorLevel.Word, out Rect rr))
                            {
                                bb.Add(rr);
                            }
                            else
                            {
                                bb.Add(new Rect(0, 0, ii, ii));
                            }
                        }
                        while (iter.Next(lvl));
                    }
                    ii = 0;
                    foreach (var p in pics)
                    {
                        using (var page = engine.Process(p))
                        {
                            //System.IO.File.WriteAllText((++ii).ToString() + ".txt", page.GetText());
                            texts.Add(page.GetText());
                        }
                    }
                }
            }
            using (Image image = Bitmap.FromFile(src_img))
            {
                int i1 = 0;
                for (int tt = 0; tt < texts.Count; tt++)
                {
                    if (string.IsNullOrEmpty(texts[tt])) continue;

                    using (Graphics graphics = Graphics.FromImage(image))
                    {
                        //graphics.FillRectangle(Brushes.Red, bb[tt].X1, bb[tt].Y1, bb[tt].Width, bb[tt].Height);
                        graphics.DrawLine(new Pen(Brushes.Red, 2), bb[tt].X1, bb[tt].Y1, bb[tt].X1 + bb[tt].Width, bb[tt].Y1); // left to right
                        graphics.DrawLine(new Pen(Brushes.Yellow, 2), bb[tt].X1, bb[tt].Y1, bb[tt].X1, bb[tt].Y1 + bb[tt].Height); // left to bottom-left

                        graphics.DrawLine(new Pen(Brushes.Green, 2), bb[tt].X1 + bb[tt].Width, bb[tt].Y1, bb[tt].X2, bb[tt].Y2); //right to bottom-right
                        graphics.DrawLine(new Pen(Brushes.Blue, 2), bb[tt].X2, bb[tt].Y2, bb[tt].X1, bb[tt].Y1 + bb[tt].Height); //bottom-right to bottom-left
                        graphics.DrawEllipse(new Pen(Brushes.Black, 3), bb[tt].X1, bb[tt].Y1, 50, 50);

                        //future ref for font size: https://stackoverflow.com/questions/7991/center-text-output-from-graphics-drawstring
                        Font font = new Font(FontFamily.GenericSansSerif, 20, FontStyle.Regular);
                        //font = FindBestFitFont(g, letter.ToString(), font, this.ClientRectangle.Size);
                        //SizeF size = g.MeasureString(letter.ToString(), font);
                        //graphics.DrawString(tt.ToString(), font, Brushes.Black, bb[tt].X1 + 15, bb[tt].Y1 + 15);
                        graphics.DrawString(i1.ToString(), font, Brushes.Black, bb[tt].X1 + 15, bb[tt].Y1 + 15);
                        o_texts.Add(texts[tt]);
                    }
                }
                image.Save("check_aa1.png");
                Console.WriteLine("{0} - {1}", image.Width, image.Height);
            }
        }
    }
}
