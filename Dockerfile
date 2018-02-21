FROM kitematic/hello-world-nginx:latest

WORKDIR /website_files
RUN git clone git@github.com:hakash/
