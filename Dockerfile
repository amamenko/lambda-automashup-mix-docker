FROM public.ecr.aws/lambda/nodejs:18

# Install ffmpeg
ADD https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz /tmp/ffmpeg.tar.xz
RUN cd /tmp && \
    tar Jxvf ffmpeg.tar.xz && \
    cp ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ffmpeg && \
    cp ffmpeg-*-amd64-static/ffprobe /usr/local/bin/ffprobe

COPY app.mjs package*.json ./

RUN npm install

CMD ["app.lambdaHandler"]