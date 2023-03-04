FROM public.ecr.aws/lambda/nodejs:18 as builder
WORKDIR /usr/app
COPY . .
RUN npm install
RUN npm run build

FROM public.ecr.aws/lambda/nodejs:18
WORKDIR ${LAMBDA_TASK_ROOT}
RUN mkdir /var/linux-arm64
COPY package.json /var/linux-arm64/package.json
COPY package.json ./
COPY --from=builder /usr/app/dist/app.js ./
COPY --from=builder /usr/app/dist/functions ./functions
RUN npm i
RUN yum -y update && yum -y install tar xz
# Install ffmpeg
ADD https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-arm64-static.tar.xz /tmp/ffmpeg.tar.xz
RUN cd /tmp && \
    tar Jxvf ffmpeg.tar.xz && \
    cp ffmpeg-*-arm64-static/ffmpeg /usr/local/bin/ffmpeg && \
    cp ffmpeg-*-arm64-static/ffprobe /usr/local/bin/ffprobe
CMD ["app.lambdaHandler"]