import java.awt.image.BufferedImage
import java.io.File
import java.nio.file.{Paths, Files}
import javax.imageio.ImageIO

object FontConv {

  def main(args: Array[String]) {
    args.foreach(proc)

  }

  def proc(arg: String): Unit = {
    val filenameIn = arg
    val filenameOut = filenameIn + ".png"

    val charWidth = 8
    val charHeight = """\.F([0-9][0-9])""".r.findFirstMatchIn(filenameIn).get.group(1).toInt

    val input = Files.readAllBytes(Paths.get(filenameIn))

    val out = new BufferedImage(charWidth * 16, charHeight * 16, BufferedImage.TYPE_4BYTE_ABGR)

    procImg(input, out, charWidth, charHeight)

    if (ImageIO.write(out, "png", new File(filenameOut))) {
      println("Wrote to " + filenameOut)
    } else {
      println("Failed")
    }
  }

  def procImg(inp: Array[Byte], img: BufferedImage, charWidth: Int, charHeight: Int): Unit = {
    for (i <- 1 until 256) {
      val offStart = i * charHeight
      val tileX = i % 16
      val tileY = i / 16

      for (y <- 0 until charHeight) {
        val line = inp(y + offStart)

        for (x <- 0 to (charWidth - 1)) {
          val bit = (line >> (charWidth - x - 1)) & 0x1
          if (bit > 0) {
            img.setRGB(x + tileX * charWidth, y + tileY * charHeight, 0xFFFFFFFF)
          } else {
            img.setRGB(x + tileX * charWidth, y + tileY * charHeight, 0xFF000000)
          }
        }
      }
    }
  }
}