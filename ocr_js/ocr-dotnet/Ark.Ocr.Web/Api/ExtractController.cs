using Microsoft.AspNetCore.Mvc;
using System.Drawing;
using System.Globalization;
using System.IO;
using Tesseract;

namespace Ark.Ocr.Web.Api
{
    public class ExtractController : ControllerBase
    {
        IWebHostEnvironment _env;
        public ExtractController(IWebHostEnvironment env)
        {
            _env = env;
        }
        [HttpPost]
        [Route("ark/extract")]
        public async Task<dynamic> extractdata()
        {
            try
            {
                if (Request.Form.Files.Count == 0) throw new ApplicationException("no file uploaded.");
                string lang = !string.IsNullOrEmpty(Request.Form["lang"][0]) ? Request.Form["lang"][0] : "tam";
                var msgs = WordTest(Request.Form.Files[0], lang);
                return new
                {
                    errored = false,
                    message = "",
                    content = msgs
                };
            }
            catch (Exception ex)
            {
                return new
                {
                    errored = true,
                    message = ex.Message
                };
            }
        }
        //[HttpPost]
        //[Route("extract/{language}")]
        //public async Task<string> extractdata(string language)
        //{

        //}
        public dynamic WordTest(IFormFile file, string lang)
        {
            List<Pix> pics = new List<Pix>();
            List<string> texts = new List<string>();
            List<string> o_texts = new List<string>();
            List<Rect> bb = new List<Rect>();
            List<float> confidence = new List<float>();
            List<float> o_confidence = new List<float>();
            var lvl = PageIteratorLevel.Word;
            var stream = file.OpenReadStream();
            var array = new byte[stream.Length];
            stream.Read(array, 0, (int)stream.Length);
            var uq_fn = $"{System.IO.Path.GetFileNameWithoutExtension(file.FileName)}_{DateTime.Now.ToString("yyyMMddhhmmssfff")}{System.IO.Path.GetExtension(file.FileName)}";
            //var src_img = @"./img_data/ch1.png";
            using (var engine = new TesseractEngine($@"./tessdata/{lang}", lang, EngineMode.TesseractAndLstm))
            //using (var engine = new TesseractEngine(@"./tessdata/eng", "eng", EngineMode.Default))
            {
                //using (var img = Pix.LoadFromFile(src_img))
                using (var img = Pix.LoadFromMemory(array))
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
                            confidence.Add(page.GetMeanConfidence());
                        }
                    }
                }
            }
            //using (Image image = Bitmap.FromFile(src_img))
            stream.Position = 0;
            using (Image image = Bitmap.FromStream(stream))
            {
                int i1 = 0;
                for (int tt = 0; tt < texts.Count; tt++)
                {
                    if (string.IsNullOrEmpty((texts[tt] ?? "").Trim())) continue;

                    using (Graphics graphics = Graphics.FromImage(image))
                    {
                        //graphics.FillRectangle(Brushes.Red, bb[tt].X1, bb[tt].Y1, bb[tt].Width, bb[tt].Height);
                        graphics.DrawLine(new Pen(Brushes.Black, 2), bb[tt].X1, bb[tt].Y1, bb[tt].X1 + bb[tt].Width, bb[tt].Y1); // left to right
                        graphics.DrawLine(new Pen(Brushes.Black, 2), bb[tt].X1, bb[tt].Y1, bb[tt].X1, bb[tt].Y1 + bb[tt].Height); // left to bottom-left

                        graphics.DrawLine(new Pen(Brushes.Black, 2), bb[tt].X1 + bb[tt].Width, bb[tt].Y1, bb[tt].X2, bb[tt].Y2); //right to bottom-right
                        graphics.DrawLine(new Pen(Brushes.Black, 2), bb[tt].X2, bb[tt].Y2, bb[tt].X1, bb[tt].Y1 + bb[tt].Height); //bottom-right to bottom-left
                        graphics.DrawEllipse(new Pen(Brushes.Black, 3), bb[tt].X1, bb[tt].Y1, 50, 50);
                        //future ref for font size: https://stackoverflow.com/questions/7991/center-text-output-from-graphics-drawstring
                        Font font = new Font(FontFamily.GenericSansSerif, 20, FontStyle.Regular);
                        //font = FindBestFitFont(g, letter.ToString(), font, this.ClientRectangle.Size);
                        //SizeF size = g.MeasureString(letter.ToString(), font);
                        graphics.DrawString((++i1).ToString(), font, Brushes.Black, bb[tt].X1 + 15, bb[tt].Y1 + 15);
                        o_texts.Add(texts[tt]);
                        o_confidence.Add(confidence[tt]);
                    }
                }
                image.Save(System.IO.Path.Combine(_env.WebRootPath, "img_upl", uq_fn));
            }
            return new
            {
                text = o_texts,
                confidence = o_confidence,
                url = $"'/img_upl/{uq_fn}'"
            };
        }
    }
}
