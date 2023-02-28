FROM public.ecr.aws/lambda/nodejs:18 as builder
WORKDIR ${LAMBDA_TASK_ROOT}

RUN yum -y update && yum -y install tar xz
COPY . .
# Install ffmpeg
ADD https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz /tmp/ffmpeg.tar.xz
RUN cd /tmp && \
    tar Jxvf ffmpeg.tar.xz && \
    cp ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ffmpeg && \
    cp ffmpeg-*-amd64-static/ffprobe /usr/local/bin/ffprobe
RUN npm ci

CMD ["app.lambdaHandler"]
